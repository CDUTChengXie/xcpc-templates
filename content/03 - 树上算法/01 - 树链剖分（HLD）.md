# 树链剖分（HLD）

输入为 `n>=1` 的连通无向树，节点 `0..n-1`。先 `HLD(n)`，每条边 `addEdge(u,v)` 一次；加完后 `work(root)`，再调用路径、子树接口。

每组数据只调用一次 `work`，查询期间不改树。区间为 `[l,r)`，需自行接线段树等区间操作；路径区间不保证 u 到 v 的顺序，只适合和、最值等不依赖顺序的聚合；`k>=0`。

work(root) 预处理 O(n)；lca / jump O(log n)，isAncester O(1)； 路径可拆成 O(log n) 段、每段线段树操作 O(log n)，合计 O(log^2 n)； 子树区间操作 O(log n)；空间 O(n)。

```cpp
struct HLD {
    int n;
    // work 后：siz[u] 为子树点数，top[u] 为重链链首
    // dep[u] 为深度（根为 0），parent[u] 为父节点（根为 -1）
    // [in[u],out[u]) 为 u 子树的 DFS 半开区间；seq[i] 是 DFS 序号 i 对应的原点，序号从 0 起
    std::vector<int> siz, top, dep, parent, in, out, seq;
    std::vector<std::vector<int>> adj; // work 后仅保留子点，不再是原始无向邻接表
    int cur;

    // 创建空对象；使用前调用 init(n)
    HLD() {}
    // 创建 n 个点的空树
    HLD(int n) {
        init(n);
    }

    // 重置为 n 个点的空树；已有边会被清空
    void init(int n) {
        this->n = n;
        siz.resize(n);
        top.resize(n);
        dep.resize(n);
        parent.resize(n);
        in.resize(n);
        out.resize(n);
        seq.resize(n);
        cur = 0;
        adj.assign(n, {});
    }

    // 加入无向边 u-v
    void addEdge(int u, int v) {
        adj[u].push_back(v);
        adj[v].push_back(u);
    }

    // 以 root 为根建立重链与 DFS 序，只能调用一次
    void work(int root = 0) {
        top[root] = root;
        dep[root] = 0;
        parent[root] = -1;
        dfs1(root);
        dfs2(root);
    }

    // 计算子树大小、深度、父亲和重儿子
    void dfs1(int u) {
        std::vector<int> order{u};
        for (size_t index = 0; index < order.size(); ++index) {
            int vertex = order[index];
            if (parent[vertex] != -1) {
                adj[vertex].erase(
                    std::find(adj[vertex].begin(), adj[vertex].end(), parent[vertex]));
            }
            siz[vertex] = 1;
            for (int next : adj[vertex]) {
                parent[next] = vertex;
                dep[next] = dep[vertex] + 1;
                order.push_back(next);
            }
        }
        for (auto iterator = order.rbegin(); iterator != order.rend(); ++iterator) {
            int vertex = *iterator;
            for (auto &next : adj[vertex]) {
                siz[vertex] += siz[next];
                if (siz[next] > siz[adj[vertex][0]])
                    std::swap(next, adj[vertex][0]);
            }
        }
    }

    // 标记重链并生成 DFS 序区间
    void dfs2(int u) {
        std::vector<int> pending{u};
        while (!pending.empty()) {
            int vertex = pending.back();
            pending.pop_back();
            in[vertex] = cur++;
            seq[in[vertex]] = vertex;
            out[vertex] = in[vertex] + siz[vertex];
            for (auto iterator = adj[vertex].rbegin(); iterator != adj[vertex].rend(); ++iterator) {
                int next = *iterator;
                top[next] = next == adj[vertex][0] ? top[vertex] : next;
                pending.push_back(next);
            }
        }
    }

    // 返回含端点路径的 DFS 半开区间；区间和区间内方向均不保证路径顺序
    std::vector<std::pair<int, int>> pathIntervals(int u, int v) const {
        std::vector<std::pair<int, int>> segs;
        while (top[u] != top[v]) {
            if (dep[top[u]] < dep[top[v]]) {
                std::swap(u, v);
            }
            segs.push_back({in[top[u]], in[u] + 1});
            u = parent[top[u]];
        }
        if (dep[u] > dep[v]) {
            std::swap(u, v);
        }
        segs.push_back({in[u], in[v] + 1});
        return segs;
    }

    // 返回 u、v 的最近公共祖先编号
    int lca(int u, int v) {
        while (top[u] != top[v]) {
            if (dep[top[u]] > dep[top[v]]) {
                u = parent[top[u]];
            } else {
                v = parent[top[v]];
            }
        }
        return dep[u] < dep[v] ? u : v;
    }

    // 返回 u、v 间的边数
    int dist(int u, int v) {
        return dep[u] + dep[v] - 2 * dep[lca(u, v)];
    }

    // 返回向上 k 步的祖先；k 超过深度返回 -1
    int jump(int u, int k) {
        if (dep[u] < k) {
            return -1;
        }
        int d = dep[u] - k;
        while (dep[top[u]] > d) {
            u = parent[top[u]];
        }
        return seq[in[u] - dep[u] + d];
    }

    // u 是 v 的祖先（含相等）返回 true
    bool isAncester(int u, int v) {
        return in[u] <= in[v] && in[v] < out[u];
    }

    // 临时以 u 为根时返回 v 的父亲
    int rootedParent(int u, int v) {
        std::swap(u, v);
        if (u == v) {
            return u;
        }
        if (!isAncester(u, v)) {
            return parent[u];
        }
        auto it = std::upper_bound(adj[u].begin(), adj[u].end(), v,
                                   [&](int x, int y) { return in[x] < in[y]; }) -
                  1;
        return *it;
    }

    // 临时以 u 为根时返回 v 的子树大小
    int rootedSize(int u, int v) {
        if (u == v) {
            return n;
        }
        if (!isAncester(v, u)) {
            return siz[v];
        }
        return n - siz[rootedParent(u, v)];
    }

    // 临时以 c 为根时返回 a、b 的 LCA
    int rootedLca(int a, int b, int c) {
        return lca(a, b) ^ lca(b, c) ^ lca(c, a);
    }
};
```
