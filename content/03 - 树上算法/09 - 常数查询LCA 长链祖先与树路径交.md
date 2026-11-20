# 常数查询LCA 长链祖先与树路径交

adj 为非空连通无向树邻接表，每条边双向加入；root 和查询点编号合法，k>=0。 节节点从 0 编号，距离为边数；构造时完成预处理，之后树结构不变。

预处理 O(n log n)；LCA、祖先、距离、路径交 O(1)；空间 O(n log n)。

```cpp
// 支持 O(1) LCA、距离、第 k 个祖先和路径交的静态树查询器
struct TreeQueries {
    int n, lg;
    std::vector<int> parent, depth, first, heavy, head, height;
    std::vector<std::vector<int>> up, sparse, downChain, upChain;
    std::vector<int> euler;
    // 用无向树邻接表和根编号构造
    TreeQueries(const std::vector<std::vector<int>> &adj, int root = 0) {
        init(adj, root);
    }
    // 用新树和根重建全部预处理
    void init(const std::vector<std::vector<int>> &adj, int root = 0) {
        n = int(adj.size());
        assert(n > 0 && root >= 0 && root < n);
        parent.assign(n, -1);
        depth.assign(n, 0);
        std::vector<int> order{root};
        parent[root] = root;
        size_t totalEdges = 0;
        for (size_t i = 0; i < order.size(); ++i) {
            int u = order[i];
            totalEdges += adj[u].size();
            for (int v : adj[u]) {
                assert(v >= 0 && v < n);
                if (v == parent[u])
                    continue;
                assert(parent[v] == -1);
                parent[v] = u;
                depth[v] = depth[u] + 1;
                order.push_back(v);
            }
        }
        assert(order.size() == size_t(n) && totalEdges == size_t(2 * (n - 1)));
        lg = std::bit_width(unsigned(n));
        up.assign(lg, parent);
        for (int k = 1; k < lg; ++k)
            for (int u = 0; u < n; ++u)
                up[k][u] = up[k - 1][up[k - 1][u]];
        heavy.assign(n, -1);
        height.assign(n, 1);
        for (int i = n - 1; i > 0; --i) {
            int u = order[i], p = parent[u];
            if (height[u] + 1 > height[p]) {
                height[p] = height[u] + 1;
                heavy[p] = u;
            }
        }
        head.resize(n);
        downChain.assign(n, {});
        upChain.assign(n, {});
        for (int u : order) {
            head[u] = (u == root || heavy[parent[u]] != u) ? u : head[parent[u]];
        }
        for (int h : order)
            if (head[h] == h) {
                for (int u = h; u != -1; u = heavy[u])
                    downChain[h].push_back(u);
                int u = h;
                for (size_t k = 0; k < downChain[h].size(); ++k) {
                    upChain[h].push_back(u);
                    u = parent[u];
                }
            }
        first.assign(n, -1);
        euler.clear();
        std::vector<std::pair<int, int>> stack{{root, 0}};
        first[root] = 0;
        euler.push_back(root);
        while (!stack.empty()) {
            int u = stack.back().first;
            int &next = stack.back().second;
            if (next == int(adj[u].size())) {
                stack.pop_back();
                if (!stack.empty())
                    euler.push_back(stack.back().first);
                continue;
            }
            int v = adj[u][next++];
            if (v == parent[u])
                continue;
            first[v] = int(euler.size());
            euler.push_back(v);
            stack.push_back({v, 0});
        }
        int m = int(euler.size()), levels = std::bit_width(unsigned(m));
        sparse.assign(levels, std::vector<int>(m));
        sparse[0] = euler;
        for (int k = 1; k < levels; ++k)
            for (int i = 0; i + (1 << k) <= m; ++i) {
                int a = sparse[k - 1][i], b = sparse[k - 1][i + (1 << (k - 1))];
                sparse[k][i] = depth[a] < depth[b] ? a : b;
            }
    }
    // 返回 u、v 的最近公共祖先编号
    int lca(int u, int v) const {
        check(u);
        check(v);
        int a = first[u], b = first[v];
        if (a > b)
            std::swap(a, b);
        int k = std::bit_width(unsigned(b - a + 1)) - 1;
        int x = sparse[k][a], y = sparse[k][b - (1 << k) + 1];
        return depth[x] < depth[y] ? x : y;
    }
    // 返回 u、v 之间的边数
    int distance(int u, int v) const {
        return depth[u] + depth[v] - 2 * depth[lca(u, v)];
    }
    // 返回 u 的第 k 个祖先，超过根返回 -1
    int ancestor(int u, int k) const {
        check(u);
        assert(k >= 0);
        if (k > depth[u])
            return -1;
        if (k == 0)
            return u;
        int bit = std::bit_width(unsigned(k)) - 1;
        u = up[bit][u];
        k -= 1 << bit;
        int h = head[u];
        k -= depth[u] - depth[h];
        return k >= 0 ? upChain[h][k] : downChain[h][-k];
    }
    // 返回两条路径的交集端点，无交集返回 nullopt
    std::optional<std::pair<int, int>> intersection(int a, int b, int c, int d) const {
        std::vector<int> points{a,         b,         c,         d,         lca(a, b),
                                lca(a, c), lca(a, d), lca(b, c), lca(b, d), lca(c, d)},
            common;
        int ab = distance(a, b), cd = distance(c, d);
        for (int x : points)
            if (distance(a, x) + distance(x, b) == ab && distance(c, x) + distance(x, d) == cd)
                common.push_back(x);
        if (common.empty())
            return std::nullopt;
        std::pair<int, int> answer{common[0], common[0]};
        int farthest = 0;
        for (int x : common)
            for (int y : common)
                if (distance(x, y) > farthest) {
                    farthest = distance(x, y);
                    answer = {x, y};
                }
        return answer;
    }

  private:
    void check(int u) const {
        assert(u >= 0 && u < n);
    }
};
```
