# 割点（Tarjan）

无向邻接表，每条边双向加入； 点下标 0..n-1；返回长 n 的布尔数组，支持重边和不连通图。

O(n+m) 时间，O(n+m) 空间。

```cpp
// 返回每个点是否为无向图割点
std::vector<bool> findCutVertex(int n, const std::vector<std::vector<int>> &adj) {
    std::vector<bool> cut(n, false);
    std::vector<int> dfn(n, -1), low(n);
    struct Frame {
        int vertex, parent, children;
        size_t next;
    };
    int timer = 0;
    for (int root = 0; root < n; ++root) {
        if (dfn[root] != -1)
            continue;
        dfn[root] = low[root] = timer++;
        std::vector<Frame> frames{{root, -1, 0, 0}};
        while (!frames.empty()) {
            auto &frame = frames.back();
            int vertex = frame.vertex;
            if (frame.next < adj[vertex].size()) {
                int next = adj[vertex][frame.next++];
                if (dfn[next] == -1) {
                    ++frame.children;
                    dfn[next] = low[next] = timer++;
                    frames.push_back({next, vertex, 0, 0});
                } else {
                    low[vertex] = std::min(low[vertex], dfn[next]);
                }
            } else {
                int parent = frame.parent;
                if (parent == -1)
                    cut[vertex] = frame.children > 1;
                frames.pop_back();
                if (parent == -1)
                    continue;
                low[parent] = std::min(low[parent], low[vertex]);
                if (frames.back().parent != -1 && low[vertex] >= dfn[parent])
                    cut[parent] = true;
            }
        }
    }
    return cut;
}
```
