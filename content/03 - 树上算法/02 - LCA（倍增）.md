# LCA（倍增）

`n>=1` 的连通无向树，节点 `0..n-1`。先 `LCA(n)`，每条边 `addEdge(u,v)` 一次；加完后 `work(root)` 再查询，根默认 `0`。查询期间不改树；新数据用 `init(n)` 重新加边、预处理。

预处理与空间 `O(n log n)`，单次查询 `O(log n)`。

```cpp
#ifndef XCPC_TEMPLATE_LCA
#define XCPC_TEMPLATE_LCA

struct LCA {
    int n, lg, root, timer;
    std::vector<std::vector<int>> adj;
    std::vector<std::vector<int>> up; // up[j][u] 为 2^j 级祖先；根的祖先仍为根
    // dep[u] 为到根的边数；dfn[u] 为从 0 编号的首次访问序
    std::vector<int> dep, dfn;

    // 创建空对象；使用前调用 init(n)
    LCA() {}
    // 创建 n 个点的空树
    explicit LCA(int n) {
        init(n);
    }

    // 重置为 n 个点的空树，需重新加边
    void init(int n) {
        this->n = n;
        lg = std::__lg(n) + 1;
        adj.assign(n, {});
    }

    // 加入无向边 u-v
    void addEdge(int u, int v) {
        adj[u].push_back(v);
        adj[v].push_back(u);
    }

    // 内部使用；预处理请调用 work(root)
    void dfs(int u, int p) {
        std::vector<std::pair<int, int>> pending{{u, p}};
        while (!pending.empty()) {
            auto [vertex, parent] = pending.back();
            pending.pop_back();
            up[0][vertex] = parent;
            dfn[vertex] = timer++;
            for (auto iterator = adj[vertex].rbegin(); iterator != adj[vertex].rend(); ++iterator) {
                int next = *iterator;
                if (next == parent)
                    continue;
                dep[next] = dep[vertex] + 1;
                pending.push_back({next, vertex});
            }
        }
    }

    // 加完边后调用；根默认 0，可换根重新计算
    void work(int root_ = 0) {
        root = root_;
        up.assign(lg, std::vector<int>(n, root));
        dep.assign(n, 0);
        dfn.assign(n, 0);
        timer = 0;
        dfs(root, root);
        for (int j = 1; j < lg; j++) {
            for (int i = 0; i < n; i++) {
                up[j][i] = up[j - 1][up[j - 1][i]];
            }
        }
    }

    // 返回 u、v 的最近公共祖先编号
    int queryLca(int u, int v) const {
        if (dep[u] < dep[v]) {
            std::swap(u, v);
        }
        int d = dep[u] - dep[v];
        for (int j = 0; j < lg; j++) {
            if (d >> j & 1) {
                u = up[j][u];
            }
        }
        if (u == v) {
            return u;
        }
        for (int j = lg - 1; j >= 0; j--) {
            if (up[j][u] != up[j][v]) {
                u = up[j][u];
                v = up[j][v];
            }
        }
        return up[0][u];
    }

    // 返回 u、v 间的非加权边数
    int dist(int u, int v) const {
        return dep[u] + dep[v] - 2 * dep[queryLca(u, v)];
    }

    // 向上 k 条边，越过根时停在根；要求 0 <= k < n
    int jump(int u, int k) const {
        for (int j = 0; j < lg; j++) {
            if (k >> j & 1) {
                u = up[j][u];
            }
        }
        return u;
    }

    // 返回 u->v 路径上第 k 个点，0-based；越界返回 -1
    int kth(int u, int v, int k) const {
        if (k < 0)
            return -1;
        int w = queryLca(u, v);
        int du = dep[u] - dep[w];
        if (k <= du) {
            return jump(u, k);
        }
        int dv = dep[v] - dep[w];
        int need = dv - (k - du);
        if (need < 0) {
            return -1;
        }
        return jump(v, need);
    }
};

#endif // XCPC_TEMPLATE_LCA
```
